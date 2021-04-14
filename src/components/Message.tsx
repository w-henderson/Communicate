import React from "react";
import Icon from "./Icon";
import FirebaseContext from "../contexts/FirebaseContext";

interface MessageProps {
  message: UserMessage,
  conversationID: string
}

class Message extends React.Component<MessageProps> {
  async componentDidMount() {
    let messageRef = this.context.database.ref(`conversations/${this.props.conversationID}/messages/${this.props.message.id}`);
    let oldMessage = (await messageRef.once("value")).val();

    if (!oldMessage.readUsers.includes(this.context.user?.id || "")) {
      oldMessage.readUsers.push(this.context.user?.id || "");
      messageRef.set(oldMessage);
    }
  }

  render() {
    let timeString = new Date(this.props.message.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    if (this.props.message.sender.id === this.context.user.id) {
      return (
        <div className="Message senderLocal">
          <div className="messageTime">
            {timeString}
          </div>
          <Icon>{this.props.message.readUsers.length > 1 ? "check-all" : "check"}</Icon>
          <div className="messageContent">
            {this.props.message.content}
          </div>
        </div>
      );
    } else {
      return (
        <div className="Message senderRemote">
          <div className="messageContent">
            {this.props.message.content}
          </div>
          <div className="messageTime">
            {timeString}
          </div>
        </div>
      );
    }
  }
}

Message.contextType = FirebaseContext;

export default Message;
