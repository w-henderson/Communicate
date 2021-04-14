import React from "react";
import "./styles/App.scss";
import googleSignInButton from './images/google_sign_in.png';
import githubSignInButton from './images/github_sign_in.png';

import Menu from './components/Menu';
import ConversationHeader from './components/ConversationHeader';
import Conversation from './components/Conversation';
import Chats from './components/Chats';

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";
import "firebase/storage";

import FirebaseContext, { FirebaseUtils } from "./firebase/FirebaseContext";
import Listeners from "./firebase/Listeners";

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
  messageUpdateListener: ((a: firebase.database.DataSnapshot | null, b?: string | null | undefined) => any) | undefined;

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
    this.storagePathToURL = this.storagePathToURL.bind(this);
    this.selectConversation = this.selectConversation.bind(this);
    this.toggleSearchBar = this.toggleSearchBar.bind(this);
    this.createConversation = this.createConversation.bind(this);
    this.disableActive = this.disableActive.bind(this);

    this.chatRefs = [];
  }

  componentDidMount() {
    this.state.firebase.auth.onAuthStateChanged(Listeners.auth.bind(this));
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
    if (this.activeMessagesListener && this.activeMessagesRef) {
      this.activeMessagesRef.off("child_added", this.activeMessagesListener);
      this.activeMessagesRef.off("child_changed", Listeners.messageUpdate.bind(this));
    }
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
      this.activeMessagesListener = this.activeMessagesRef?.on("child_added", Listeners.newMessage.bind(this));
      this.messageUpdateListener = this.activeMessagesRef?.on("child_changed", Listeners.messageUpdate.bind(this));
    });
  }

  disableActive() {
    if (this.activeMessagesListener && this.activeMessagesRef) {
      this.activeMessagesRef.off("child_added", this.activeMessagesListener);
      this.activeMessagesRef.off("child_changed", Listeners.messageUpdate.bind(this));
    }
    this.setState({ activeChat: null });
  }

  signIn(provider: "Google" | "GitHub") {
    switch (provider) {
      case "Google": this.state.firebase.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()); break;
      case "GitHub": this.state.firebase.auth.signInWithPopup(new firebase.auth.GithubAuthProvider()); break;
    };
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
      .on("value", (e) => Listeners.chatPreview.bind(this)(e, newConversationRef.key || ""));
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
