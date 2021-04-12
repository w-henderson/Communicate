import React from "react";
import Message from "./Message";
import Icon from "./Icon";
import '../styles/Conversation.scss';

interface ConversationProps {
  chat: FullChat | null,
  user: User,
  readCallback: (conversationID: string, messageID: string) => void,
  sendCallback: (message: string) => void
}

interface ConversationState {
  message: string
}

class Conversation extends React.Component<ConversationProps, ConversationState> {
  constructor(props) {
    super(props);
    this.state = {
      message: ""
    };
  }

  preSend(e: React.KeyboardEvent) {
    if (e.key === "Enter") this.sendMessage();
  }

  sendMessage() {
    this.props.sendCallback(this.state.message);
    this.setState({ message: "" });
  }

  render() {
    if (this.props.chat !== null && this.props.chat !== undefined) {
      return (
        <div className="Conversation">
          <div className="messages">
            {this.props.chat.messages.map((value, index) =>
              <Message
                key={index}
                message={value}
                user={this.props.user}
                readCallback={() => this.props.readCallback(this.props.chat?.id || "-1", value.id)} />
            )}
          </div>

          <div className="messageInput">
            <input
              placeholder="Type a message"
              onChange={(e) => this.setState({ message: e.target.value })}
              onKeyDown={this.preSend.bind(this)}
              value={this.state.message} />
            <Icon onClick={this.sendMessage.bind(this)}>cursor-fill</Icon>
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
