import React from "react";
import "./styles/App.scss";
import signInButton from './images/google_sign_in.png';
import defaultProfilePicture from './images/placeholder_profile_picture.png';

import Menu from './components/Menu';
import ConversationHeader from './components/ConversationHeader';
import Conversation from './components/Conversation';
import Chats from './components/Chats';

import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

interface AppState {
  user: User | null,
  chats: Chat[],
  activeChat: FullChat | null
};

class App extends React.Component<{}, AppState> {
  auth: firebase.auth.Auth;
  db: firebase.database.Database;

  constructor(props) {
    super(props);

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: process.env.REACT_APP_FIREBASE_KEY,
        authDomain: process.env.REACT_APP_FIREBASE_AUTH,
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
        storageBucket: process.env.REACT_APP_FIREBASE_STORAGE,
        messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING,
        appId: process.env.REACT_APP_FIREBASE_APP_ID
      });
    } else {
      firebase.app();
    }

    this.auth = firebase.auth();
    this.db = firebase.database();
    this.signIn = this.signIn.bind(this);
    this.updateAuthDisplay = this.updateAuthDisplay.bind(this);
  }

  componentDidMount() {
    this.auth.onAuthStateChanged(this.updateAuthDisplay);
  }

  signIn() {
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  updateAuthDisplay(user: firebase.User | null) {
    if (user !== null) {
      console.log(user.uid);
      this.setState({
        user: {
          name: user.displayName || "User",
          id: user.uid,
          profilePicture: user.photoURL || defaultProfilePicture
        }
      });
    }
  }

  render() {
    if (this.state !== null && this.state.user !== null) {
      return (
        <div className="App">
          <Menu user={this.state.user} />
          <ConversationHeader recipientUser={this.state.activeChat?.recipient} />
          <Chats chats={this.state.chats} user={this.state.user} activeID={this.state.activeChat?.id} />
          <Conversation chat={this.state.activeChat} user={this.state.user} />
        </div>
      );
    } else {
      return (
        <div className="SignIn">
          <img src={signInButton} alt="Sign in button" onClick={this.signIn} />
        </div>
      )
    }
  }
}

export default App;
