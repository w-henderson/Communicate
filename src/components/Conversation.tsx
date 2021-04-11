import React from "react";
import Message from "./Message";
import Icon from "./Icon";
import '../styles/Conversation.scss';

interface ConversationProps {
  chat: FullChat | null,
  user: User
}

class Conversation extends React.Component<ConversationProps> {
  render() {
    if (this.props.chat !== null && this.props.chat !== undefined) {
      return (
        <div className="Conversation">
          <div className="messages">
            {this.props.chat.messages.map((value, index) =>
              <Message key={index} message={value} user={this.props.user} />
            )}
          </div>

          <div className="messageInput">
            <input placeholder="Type a message" />
            <Icon>cursor-fill</Icon>
          </div>
        </div>
      );
    } else {
      return (
        <div className="Conversation empty">
          Welcome to Communicate!<br />
          Select a conversation from the left to start.
        </div>
      )
    }
  }
}

export default Conversation;
