import App from "../App";
import defaultProfilePicture from "../images/placeholder_profile_picture.png";

import firebase from "firebase";
import "firebase/database";

/** 
 * Handles all user changes.
 * This is hooked to the `users/<key>` database path and takes `value` requests.
 * Updates user information and joined conversations, but not messages.
 */
async function userListener(this: App, snapshot: firebase.database.DataSnapshot) {
  let val = snapshot.val();

  if (val === null && this.state.firebase.user !== null) {
    let profilePictureRef = this.state.firebase.storage.ref(`users/${snapshot.key}.jpg`);
    let profilePicture = await (await fetch(this.state.firebase.user.profilePicture)).blob();

    await profilePictureRef.put(profilePicture);

    this.userRef?.set({
      name: this.state.firebase.user.name,
      profilePicture: `users/${snapshot.key}.jpg`,
      emailAddress: this.state.firebase.user.emailAddress
    });

    return;
  }

  let self: User = {
    name: val.name || "User",
    id: snapshot.key || "",
    profilePicture: (await this.storagePathToURL(val.profilePicture)) || defaultProfilePicture,
    emailAddress: val.emailAddress
  }

  let oldFirebase = this.state.firebase;
  oldFirebase.user = self;

  this.setState({
    firebase: oldFirebase
  });

  // Add shallow listeners for each conversation
  if (val.conversations) {
    // If chat was deleted by the other user, hide it
    if (this.state.activeChat && !Object.values(val.conversations).includes(this.state.activeChat.id)) {
      this.disableActive();
    }

    this.chatRefs = Object.values(val.conversations).map(id => this.state.firebase.database.ref(`conversations/${id}`));

    let newChatsState: Chat[] = [];
    for (let chatRef of this.chatRefs) {
      let participants: string[] = Object.values((await chatRef.child("participants").once("value")).val());
      let remoteParticipant = participants.find(value => value !== snapshot.key);
      let lastMessage = (await chatRef.child("messages").limitToLast(1).once("value")).val();
      let senderUser = (await this.state.firebase.database.ref(`users/${remoteParticipant}`).once("value")).val();

      let sender: User = {
        name: senderUser.name,
        id: remoteParticipant || "",
        profilePicture: await this.storagePathToURL(senderUser.profilePicture),
        emailAddress: senderUser.emailAddress
      }

      let mostRecentMessage: UserMessage | null;
      if (lastMessage) {
        let lastMessageID = Object.keys(lastMessage)[0];
        lastMessage = lastMessage[lastMessageID];

        // TODO: allow for more than 2 users
        let readUsers: User[] = lastMessage.readUsers.map(user => user === self.id ? self : sender);

        mostRecentMessage = {
          id: lastMessageID,
          content: lastMessage.content,
          sender: lastMessage.sender === remoteParticipant ? sender : self,
          timestamp: lastMessage.timestamp,
          readUsers
        }
      } else {
        mostRecentMessage = null;
      }

      newChatsState.push({
        recipient: sender,
        id: chatRef.key || "",
        mostRecentMessage
      });
    }

    this.setState({
      chats: newChatsState
    }, () => {
      for (let chatRef of this.chatRefs) {
        chatRef.child("messages").limitToLast(1).on("value", (e) => chatPreviewListener.bind(this)(e, chatRef.key || ""));
      }
    });
  }
}

/**
 * Handles new messages.
 * Hooked to the `conversations/<key>/messages` path and responds to `child_added` requests.
 * Adds the message to the state of the app.
 */
async function newMessageListener(this: App, snapshot: firebase.database.DataSnapshot) {
  let val = snapshot.val();
  let sender = val.sender === this.state.firebase.user?.id ? this.state.firebase.user : this.state.activeChat?.recipient;

  let readUsers: User[] = val.readUsers.map(value => value === this.state.firebase.user?.id ? this.state.firebase.user : sender);

  let oldActiveChat = this.state.activeChat;
  if (this.state.firebase.user === null) return;
  oldActiveChat?.messages.push({
    id: snapshot.key || "-1",
    content: val.content,
    sender: sender || this.state.firebase.user,
    readUsers,
    timestamp: val.timestamp
  });

  this.setState({
    activeChat: oldActiveChat
  });
}

/**
 * Handles message updates.
 * Hooked to the `conversations/<key>/messages` path and responds to `child_changed` requests.
 * Currently only updates state of read users.
 */
function messageUpdateListener(this: App, snapshot: firebase.database.DataSnapshot) {
  let val = snapshot.val();
  let messageIndex = this.state.activeChat?.messages.findIndex(value => value.id === snapshot.key);
  let sender = this.state.activeChat?.recipient;
  let readUsers: User[] = val.readUsers.map(value => value === this.state.firebase.user?.id ? this.state.firebase.user : sender);

  let oldActiveChat = this.state.activeChat;
  let oldMessage = this.state.activeChat?.messages[messageIndex || -1];
  if (!oldMessage || !oldActiveChat || !this.state.firebase.user) return;
  if (this.state.firebase.user === null) return;
  oldMessage.readUsers = readUsers;
  oldActiveChat.messages[messageIndex || -1] = oldMessage;

  this.setState({
    activeChat: oldActiveChat
  });
}

/**
 * Handles authentication changes.
 */
function authListener(this: App, user: firebase.User | null) {
  if (user !== null) {
    let displayName = user.displayName || prompt("Choose a display name:");
    let emailAddress = user.email || prompt("Enter your email address:");

    if (displayName === null || emailAddress === null) {
      authListener.bind(this)(user);
      return;
    }

    let oldFirebase = this.state.firebase;
    oldFirebase.user = {
      name: displayName,
      id: user.uid,
      profilePicture: user.photoURL || defaultProfilePicture,
      emailAddress,
    };

    this.setState({
      firebase: oldFirebase
    }, () => {
      this.userRef = this.state.firebase.database.ref(`users/${user.uid}`);
      this.userRef.on("value", userListener.bind(this));
    });
  }
}

/**
 * Handles updates of a specific chat preview on the left tab.
 * Hooked to the `child_added` event of `conversations/<key>/messages`.
 */
function chatPreviewListener(this: App, snapshot: firebase.database.DataSnapshot, id: string) {
  if (this.state.chats === undefined) return;

  let oldState = this.state.chats;
  let oldStateIndex = oldState.findIndex(value => value.id === id);

  let val = snapshot.val();

  if (val) {
    let lastMessageID = Object.keys(val)[0];
    val = val[lastMessageID];

    let readUsers: User[] = val.readUsers.map(user =>
      user === this.state.firebase.user?.id ? this.state.firebase.user : oldState[oldStateIndex].recipient);

    oldState[oldStateIndex].mostRecentMessage = {
      id: lastMessageID,
      content: val.content,
      sender: oldState[oldStateIndex].recipient,
      timestamp: val.timestamp,
      readUsers
    };

    oldState.sort((a, b) => {
      if (a.mostRecentMessage && b.mostRecentMessage) {
        return b.mostRecentMessage.timestamp - a.mostRecentMessage.timestamp;
      } else if (a.mostRecentMessage) {
        return 1;
      } else {
        return -1;
      }
    });

    this.setState({
      chats: oldState
    });
  }
}

const exports = {
  user: userListener,
  auth: authListener,
  newMessage: newMessageListener,
  messageUpdate: messageUpdateListener,
  chatPreview: chatPreviewListener
}

export default exports;