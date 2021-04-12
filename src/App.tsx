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
import "firebase/storage";

interface AppState {
  user: User | null,
  chats: Chat[],
  activeChat: FullChat | null
};

class App extends React.Component<{}, AppState> {
  auth: firebase.auth.Auth;
  db: firebase.database.Database;
  storage: firebase.storage.Storage;
  userRef: firebase.database.Reference | undefined;
  chatRefs: firebase.database.Reference[];

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

    this.chatRefs = [];
  }

  componentDidMount() {
    this.auth.onAuthStateChanged(this.updateAuthDisplay);
  }

  storagePathToURL(path: string): Promise<string> {
    return this.storage.ref(path).getDownloadURL();
  }

  async userListener(snapshot: firebase.database.DataSnapshot) {
    let val = snapshot.val();

    console.log(val);

    if (val === null && this.state.user !== null) {
      let profilePictureRef = this.storage.ref(`users/${snapshot.key}.jpg`);
      let profilePicture = await (await fetch(this.state.user.profilePicture)).blob();

      await profilePictureRef.put(profilePicture);

      this.userRef?.set({
        name: this.state.user?.name,
        profilePicture: `users/${snapshot.key}.jpg`
      });

      return;
    }

    let self: User = {
      name: val.name || "User",
      id: snapshot.key || "",
      profilePicture: (await this.storagePathToURL(val.profilePicture)) || defaultProfilePicture
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

        lastMessage = lastMessage[lastMessage.length - 1];

        let sender: User = {
          name: senderUser.name,
          id: remoteParticipant || "",
          profilePicture: await this.storagePathToURL(senderUser.profilePicture)
        }

        // TODO: allow for more than 2 users
        let readUsers: User[] = lastMessage.readUsers.map(user => user === self.id ? self : sender);

        newChatsState.push({
          recipient: sender,
          id: chatRef.key || "",
          mostRecentMessage: {
            content: lastMessage.content,
            sender: lastMessage.sender === remoteParticipant ? sender : self,
            timestamp: lastMessage.timestamp,
            readUsers
          }
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

  conversationPreviewUpdate(snapshot: firebase.database.DataSnapshot, id: string) {
    let oldState = this.state.chats;
    let oldStateIndex = oldState.findIndex(value => value.id === id);
    let val = snapshot.val()[snapshot.val().length - 1];

    let readUsers: User[] = val.readUsers.map(user =>
      user === this.state.user?.id ? this.state.user : oldState[oldStateIndex].recipient);

    oldState[oldStateIndex].mostRecentMessage = {
      content: val.content,
      sender: oldState[oldStateIndex].recipient,
      timestamp: val.timestamp,
      readUsers
    };

    this.setState({
      chats: oldState
    });
  }

  signIn() {
    this.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
  }

  updateAuthDisplay(user: firebase.User | null) {
    if (user !== null) {
      this.setState({
        user: {
          name: user.displayName || "User",
          id: user.uid,
          profilePicture: user.photoURL || defaultProfilePicture
        }
      }, () => {
        this.userRef = this.db.ref(`users/${user.uid}`);
        this.userRef.on("value", this.userListener);
        console.log("set up listener");
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
