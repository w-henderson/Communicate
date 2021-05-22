import React from "react";
import Message from "./Message";
import TypingBubble from "./TypingBubble";
import Icon from "./Icon";
import FirebaseContext from "../firebase/FirebaseContext";
import '../styles/Conversation.scss';

interface ConversationProps {
  chat: FullChat | null | undefined,
  changeTypingState: (typing: boolean) => void
}

interface ConversationState {
  message: string,
  typingState: boolean,
  lastKeyPressTimestamp: number,
}

class Conversation extends React.Component<ConversationProps, ConversationState> {
  typingInterval: number;

  constructor(props) {
    super(props);
    this.state = {
      message: "",
      typingState: false,
      lastKeyPressTimestamp: 0
    };

    this.typingInterval = 0;
    this.sendMessage = this.sendMessage.bind(this);
    this.preSend = this.preSend.bind(this);
    this.updateTyping = this.updateTyping.bind(this);
  }

  componentDidMount() {
    this.typingInterval = window.setInterval(this.updateTyping, 250);
    window.onbeforeunload = () => {
      if (this.props.chat) {
        this.context.database.ref(`conversations/${this.props.chat?.id}/typing/${this.context.user?.id}`).set(false);
      }
    };
  }

  updateTyping() {
    let timeSinceKeypress = new Date().getTime() - this.state.lastKeyPressTimestamp;
    if (timeSinceKeypress < 2500 && !this.state.typingState) {
      this.props.changeTypingState(true);
      this.setState({ typingState: true });
    } else if (timeSinceKeypress >= 2500 && this.state.typingState) {
      this.props.changeTypingState(false);
      this.setState({ typingState: false });
    }
  }

  preSend(e: React.KeyboardEvent) {
    this.setState({ lastKeyPressTimestamp: new Date().getTime() });
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
    this.setState({ message: "", lastKeyPressTimestamp: 0, typingState: false });
    this.props.changeTypingState(false);
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
            {this.props.chat.recipientTyping &&
              <TypingBubble />
            }
          </div>

          <div className="messageInput">
            <input
              placeholder="Type a message"
              onChange={(e) => this.setState({ message: e.target.value })}
              onKeyDown={this.preSend}
              value={this.state.message} />
            <Icon onClick={this.sendMessage}>cursor</Icon>
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
