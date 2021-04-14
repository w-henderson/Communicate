import React from "react";
import Message from "./Message";
import Icon from "./Icon";
import FirebaseContext from "../contexts/FirebaseContext";
import '../styles/Conversation.scss';

interface ConversationProps {
  chat: FullChat | null | undefined
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

    this.sendMessage = this.sendMessage.bind(this);
    this.preSend = this.preSend.bind(this);
  }

  preSend(e: React.KeyboardEvent) {
    if (e.key === "Enter") this.sendMessage();
  }

  sendMessage() {
    if (this.state.message.trim() === "") return;

    let newMessage = {
      content: this.state.message,
      readUsers: [this.context.user?.id],
      sender: this.context.user?.id,
      timestamp: new Date().getTime()
    };

    let newMessageRef = this.context.database.ref(`conversations/${this.props.chat?.id}/messages`).push();
    newMessageRef.set(newMessage);
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
                conversationID={this.props.chat?.id || ""} />
            )}
          </div>

          <div className="messageInput">
            <input
              placeholder="Type a message"
              onChange={(e) => this.setState({ message: e.target.value })}
              onKeyDown={this.preSend}
              value={this.state.message} />
            <Icon onClick={this.sendMessage}>cursor-fill</Icon>
          </div>
        </div>
      );
    } else if (this.props.chat === null) {
      return (
        <div className="Conversation empty">
          Welcome to Communicate!<br />
          Select a conversation from the left to start.
        </div>
      )
    } else {
      return (
        <div className="Conversation empty">
          <Icon spin={true}>arrow-repeat</Icon>
        </div>
      )
    }
  }
}

Conversation.contextType = FirebaseContext;

export default Conversation;
