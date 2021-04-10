import React from "react";
import "./styles/App.scss";
import profilePicture from './images/placeholder_profile_picture.jpg';

import Menu from './components/Menu';
import ConversationHeader from './components/ConversationHeader';
import Conversation from './components/Conversation';
import Chats from './components/Chats';

interface AppState {
  user: User | null,
  chats: Chat[],
  activeChat: FullChat | null
};

class App extends React.Component<{}, AppState> {
  componentDidMount() {
    // Set a virtual user for debugging before we add Firebase auth
    let user = {
      name: "William Henderson",
      profilePicture: profilePicture,
      id: "1c31d64f-8c57-481d-81a5-1a58acdabc5b"
    };

    // Set a virtual message for debugging before we add FBRTDB
    let chat = {
      recipient: user,
      id: "bd18e35b-961e-4393-95e3-36c7bc59f2f5",
      mostRecentMessage: {
        content: "This is an example message",
        sender: user,
        timestamp: 1617794712076,
        readUsers: [user]
      }
    };

    let message = {
      content: "This is an example message 2",
      sender: user,
      timestamp: 1617894712076,
      readUsers: [user]
    };

    let otherChat = {
      recipient: user,
      id: "bd18e35b-961e-4393-95e3-36c7bc59f2f6",
      mostRecentMessage: message
    };

    this.setState({
      user,
      chats: [
        otherChat, chat, chat, chat, chat, chat, chat, chat, chat, chat
      ],
      activeChat: {
        recipient: user,
        id: "bd18e35b-961e-4393-95e3-36c7bc59f2f6",
        messages: [message, message, message]
      }
    });
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
        <div></div>
      )
    }
  }
}

export default App;
