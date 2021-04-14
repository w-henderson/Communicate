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

import FirebaseContext, { FirebaseUtils } from "./contexts/FirebaseContext";

interface AppState {
  chats: Chat[] | undefined,
  activeChat: FullChat | null | undefined,
  searchBarActive: boolean,
  mobile: boolean,
  firebase: FirebaseUtils
};

class App extends React.Component<{}, AppState> {
  userRef: firebase.database.Reference | undefined;
  chatRefs: firebase.database.Reference[];
  activeMessagesRef: firebase.database.Reference | undefined;
  activeMessagesListener: ((a: firebase.database.DataSnapshot | null, b?: string | null | undefined) => any) | undefined;

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

    this.state = {
      chats: undefined,
      activeChat: null,
      searchBarActive: false,
      mobile: false,
      firebase: {
        auth: firebase.auth(),
        database: firebase.database(),
        storage: firebase.storage(),
        user: null
      }
    };

    this.signIn = this.signIn.bind(this);
    this.updateAuthDisplay = this.updateAuthDisplay.bind(this);
    this.userListener = this.userListener.bind(this);
    this.conversationPreviewUpdate = this.conversationPreviewUpdate.bind(this);
    this.storagePathToURL = this.storagePathToURL.bind(this);
    this.selectConversation = this.selectConversation.bind(this);
    this.newMessageHandler = this.newMessageHandler.bind(this);
    this.toggleSearchBar = this.toggleSearchBar.bind(this);
    this.createConversation = this.createConversation.bind(this);
    this.disableActive = this.disableActive.bind(this);

    this.chatRefs = [];
  }

  componentDidMount() {
    this.state.firebase.auth.onAuthStateChanged(this.updateAuthDisplay);
    this.setState({
      mobile: window.matchMedia("(max-width: 600px)").matches
    });

    window.onresize = () => {
      this.setState({
        mobile: window.matchMedia("(max-width: 600px)").matches
      });
    }
  }

  storagePathToURL(path: string): Promise<string> {
    return this.state.firebase.storage.ref(path).getDownloadURL();
  }

  uidToObject(uid: string): Promise<User> {
    return this.state.firebase.database.ref(`users/${uid}`).once("value").then(async val => {
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
    this.setState({ activeChat: undefined });

    let mainRef = this.state.firebase.database.ref(`conversations/${id}`);
    if (this.activeMessagesListener && this.activeMessagesRef) this.activeMessagesRef.off("child_added", this.activeMessagesListener);
    this.activeMessagesRef = this.state.firebase.database.ref(`conversations/${id}/messages`);

    let val = (await mainRef.once("value")).val();
    let recipientID = val.participants.find(value => value !== this.state.firebase.user?.id);
    let recipient = await this.uidToObject(recipientID);

    this.setState({
      activeChat: {
        recipient,
        id,
        messages: []
      }
    }, () => {
      this.activeMessagesListener = this.activeMessagesRef?.on("child_added", this.newMessageHandler);
    });
  }

  disableActive() {
    if (this.activeMessagesListener && this.activeMessagesRef) this.activeMessagesRef.off("child_added", this.activeMessagesListener);
    this.setState({ activeChat: null });
  }

  async newMessageHandler(snapshot: firebase.database.DataSnapshot) {
    let val = snapshot.val();
    let sender = val.sender === this.state.firebase.user?.id ? this.state.firebase.user : this.state.activeChat?.recipient;

    let oldActiveChat = this.state.activeChat;
    if (this.state.firebase.user === null) return;
    oldActiveChat?.messages.push({
      id: snapshot.key || "-1",
      content: val.content,
      sender: sender || this.state.firebase.user,
      readUsers: [],
      timestamp: val.timestamp
    });

    this.setState({
      activeChat: oldActiveChat
    });
  }

  async userListener(snapshot: firebase.database.DataSnapshot) {
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
          chatRef.child("messages").limitToLast(1).on("value", (e) => this.conversationPreviewUpdate(e, chatRef.key || ""));
        }
      });
    }
  }

  conversationPreviewUpdate(snapshot: firebase.database.DataSnapshot, id: string) {
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

  signIn(provider: "Google" | "GitHub") {
    switch (provider) {
      case "Google": this.state.firebase.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); break;
      case "GitHub": this.state.firebase.auth.signInWithPopup(new firebase.auth.GithubAuthProvider()); break;
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
        this.userRef.on("value", this.userListener);
      });
    }
  }

  toggleSearchBar() {
    let currentSearchBarState = this.state.searchBarActive;
    this.setState({ searchBarActive: !currentSearchBarState });
  }

  async createConversation(user: User) {
    // Create conversation instance
    let newConversationRef = this.state.firebase.database.ref("conversations").push();
    await newConversationRef.set({
      participants: [
        this.state.firebase.user?.id,
        user.id
      ]
    });

    // Add conversation to sender user
    await this.userRef?.child("conversations").push().set(newConversationRef.key);

    // Add conversation to recipient user
    await this.state.firebase.database.ref(`users/${user.id}/conversations`).push().set(newConversationRef.key);

    // Select the conversation
    this.selectConversation(newConversationRef.key || "");
    this.chatRefs.push(newConversationRef);
    this.chatRefs[this.chatRefs.length - 1]
      .child("messages")
      .limitToLast(1)
      .on("value", (e) => this.conversationPreviewUpdate(e, newConversationRef.key || ""));
    this.setState({ searchBarActive: false });
  }

  render() {
    if (this.state !== null && this.state.firebase.user !== null) {
      let appClass: string;
      if (this.state.mobile) appClass = this.state.activeChat !== null ? "App rightColumn" : "App leftColumn";
      else appClass = "App";

      return (
        <FirebaseContext.Provider value={this.state.firebase}>
          <div className={appClass}>
            <Menu
              searchCallback={this.toggleSearchBar} />
            <ConversationHeader
              recipientUser={this.state.activeChat?.recipient}
              showBackButton={this.state.mobile}
              back={this.disableActive} />
            <Chats
              chats={this.state.chats}
              activeID={this.state.activeChat?.id}
              selectCallback={this.selectConversation}
              searchBarActive={this.state.searchBarActive}
              createConversation={this.createConversation} />
            <Conversation
              chat={this.state.activeChat} />
          </div>
        </FirebaseContext.Provider>
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
