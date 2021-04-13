import React from "react";
import "./styles/App.scss";
import googleSignInButton from './images/google_sign_in.png';
import githubSignInButton from './images/github_sign_in.png';
import defaultProfilePicture from './images/placeholder_profile_picture.png';

import Menu from './components/Menu';
import ConversationHeader from './components/ConversationHeader';
import Conversation from './components/Conversation';
import Chats from './components/Chats';

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

interface AppState {
  user: User | null,
  chats: Chat[],
  activeChat: FullChat | null,
  searchBarActive: boolean
};

class App extends React.Component<{}, AppState> {
  auth: firebase.auth.Auth;
  db: firebase.database.Database;
  storage: firebase.storage.Storage;
  userRef: firebase.database.Reference | undefined;
  chatRefs: firebase.database.Reference[];
  activeMessages: firebase.database.Reference | undefined;

  constructor(props) {
    super(props);

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
      });
    } else {
      firebase.app();
    }

    this.auth = firebase.auth();
    this.db = firebase.database();
    this.storage = firebase.storage();

    this.signIn = this.signIn.bind(this);
    this.updateAuthDisplay = this.updateAuthDisplay.bind(this);
    this.userListener = this.userListener.bind(this);
    this.conversationPreviewUpdate = this.conversationPreviewUpdate.bind(this);
    this.storagePathToURL = this.storagePathToURL.bind(this);
    this.selectConversation = this.selectConversation.bind(this);
    this.newMessageHandler = this.newMessageHandler.bind(this);
    this.markMessageAsRead = this.markMessageAsRead.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.toggleSearchBar = this.toggleSearchBar.bind(this);

    this.chatRefs = [];
  }

  componentDidMount() {
    this.auth.onAuthStateChanged(this.updateAuthDisplay);
  }

  storagePathToURL(path: string): Promise<string> {
    return this.storage.ref(path).getDownloadURL();
  }

  uidToObject(uid: string): Promise<User> {
    return this.db.ref(`users/${uid}`).once("value").then(async val => {
      let value = val.val();
      let name = value.name;
      let profilePicture = await this.storagePathToURL(value.profilePicture);

      return {
        name,
        id: uid,
        profilePicture,
        emailAddress: value.emailAddress
      };
    });
  }

  async selectConversation(id: string) {
    let mainRef = this.db.ref(`conversations/${id}`);
    if (this.activeMessages) this.activeMessages.off();
    this.activeMessages = this.db.ref(`conversations/${id}/messages`);

    let val = (await mainRef.once("value")).val();
    let recipientID = val.participants.find(value => value !== this.state.user?.id);
    let recipient = await this.uidToObject(recipientID);

    this.setState({
      activeChat: {
        recipient,
        id,
        messages: []
      }
    }, () => {
      this.activeMessages?.on("child_added", this.newMessageHandler);
    });
  }

  async newMessageHandler(snapshot: firebase.database.DataSnapshot) {
    let val = snapshot.val();
    let sender = val.sender === this.state.user?.id ? this.state.user : this.state.activeChat?.recipient;

    let oldActiveChat = this.state.activeChat;
    if (this.state.user === null) return;
    oldActiveChat?.messages.push({
      id: snapshot.key || "-1",
      content: val.content,
      sender: sender || this.state.user,
      readUsers: [],
      timestamp: val.timestamp
    });

    this.setState({
      activeChat: oldActiveChat
    });
  }

  async userListener(snapshot: firebase.database.DataSnapshot) {
    let val = snapshot.val();

    console.log(val);

    if (val === null && this.state.user !== null) {
      let profilePictureRef = this.storage.ref(`users/${snapshot.key}.jpg`);
      let profilePicture = await (await fetch(this.state.user.profilePicture)).blob();

      await profilePictureRef.put(profilePicture);

      this.userRef?.set({
        name: this.state.user.name,
        profilePicture: `users/${snapshot.key}.jpg`,
        emailAddress: this.state.user.emailAddress
      });

      return;
    }

    let self: User = {
      name: val.name || "User",
      id: snapshot.key || "",
      profilePicture: (await this.storagePathToURL(val.profilePicture)) || defaultProfilePicture,
      emailAddress: val.emailAddress
    }

    this.setState({
      user: self
    });

    // Add shallow listeners for each conversation
    if (val.conversations) {
      this.chatRefs = val.conversations.map(id => this.db.ref(`conversations/${id}`));

      let newChatsState: Chat[] = [];
      for (let chatRef of this.chatRefs) {
        let participants: string[] = Object.values((await chatRef.child("participants").once("value")).val());
        let remoteParticipant = participants.find(value => value !== snapshot.key);
        let lastMessage = (await chatRef.child("messages").limitToLast(1).once("value")).val();
        let senderUser = (await this.db.ref(`users/${remoteParticipant}`).once("value")).val();

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
        for (let chatRef of val.conversations.map(id => this.db.ref(`conversations/${id}`))) {
          chatRef.child("messages").limitToLast(1).on("value", (e) => this.conversationPreviewUpdate(e, chatRef.key));
        }
      });
    }
  }

  async markMessageAsRead(conversationID: string, messageID: string) {
    let messageRef = this.db.ref(`conversations/${conversationID}/messages/${messageID}`);
    let oldMessage = (await messageRef.once("value")).val();

    if (!oldMessage.readUsers.includes(this.state.user?.id || "")) {
      oldMessage.readUsers.push(this.state.user?.id || "");
      messageRef.set(oldMessage);
    }
  }

  conversationPreviewUpdate(snapshot: firebase.database.DataSnapshot, id: string) {
    let oldState = this.state.chats;
    let oldStateIndex = oldState.findIndex(value => value.id === id);

    let val = snapshot.val();

    if (val) {
      let lastMessageID = Object.keys(val)[0];
      val = val[lastMessageID];

      let readUsers: User[] = val.readUsers.map(user =>
        user === this.state.user?.id ? this.state.user : oldState[oldStateIndex].recipient);

      oldState[oldStateIndex].mostRecentMessage = {
        id: lastMessageID,
        content: val.content,
        sender: oldState[oldStateIndex].recipient,
        timestamp: val.timestamp,
        readUsers
      };

      this.setState({
        chats: oldState
      });
    }
  }

  signIn(provider: "Google" | "GitHub") {
    switch (provider) {
      case "Google": this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); break;
      case "GitHub": this.auth.signInWithPopup(new firebase.auth.GithubAuthProvider()); break;
    };
  }

  updateAuthDisplay(user: firebase.User | null) {
    if (user !== null) {
      let displayName = user.displayName || prompt("Choose a display name:");
      let emailAddress = user.email || prompt("Enter your email address:");

      if (displayName === null || emailAddress === null) {
        this.updateAuthDisplay(user);
        return;
      }

      this.setState({
        user: {
          name: displayName,
          id: user.uid,
          profilePicture: user.photoURL || defaultProfilePicture,
          emailAddress,
        }
      }, () => {
        this.userRef = this.db.ref(`users/${user.uid}`);
        this.userRef.on("value", this.userListener);
        console.log("set up listener");
      });
    }
  }

  toggleSearchBar() {
    let currentSearchBarState = this.state.searchBarActive;
    this.setState({ searchBarActive: !currentSearchBarState });
  }

  sendMessage(message: string) {
    let newMessage = {
      content: message,
      readUsers: [this.state.user?.id],
      sender: this.state.user?.id,
      timestamp: new Date().getTime()
    };

    let newMessageRef = this.db.ref(`conversations/${this.state.activeChat?.id}/messages`).push();
    newMessageRef.set(newMessage);
  }

  render() {
    if (this.state !== null && this.state.user !== null) {
      return (
        <div className="App">
          <Menu
            user={this.state.user}
            searchCallback={this.toggleSearchBar} />
          <ConversationHeader
            recipientUser={this.state.activeChat?.recipient} />
          <Chats
            chats={this.state.chats}
            user={this.state.user}
            activeID={this.state.activeChat?.id}
            selectCallback={this.selectConversation}
            searchBarActive={this.state.searchBarActive} />
          <Conversation
            chat={this.state.activeChat}
            user={this.state.user}
            readCallback={this.markMessageAsRead}
            sendCallback={this.sendMessage} />
        </div>
      );
    } else {
      return (
        <div className="SignIn">
          <img src={googleSignInButton} alt="Sign in with Google" onClick={() => this.signIn("Google")} draggable={false} />
          <img src={githubSignInButton} alt="Sign in with GitHub" onClick={() => this.signIn("GitHub")} draggable={false} />
        </div>
      )
    }
  }

  componentDidUpdate() {
    let messages = document.querySelector("div.messages");
    let lastMessage = messages?.lastElementChild;
    if (lastMessage) lastMessage.scrollIntoView();
  }
}

export default App;
