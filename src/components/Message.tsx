import React from "react";

interface MessageProps {
  message: UserMessage,
  user: User
}

class Message extends React.Component<MessageProps> {
  render() {
    let timeString = new Date(this.props.message.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

    if (this.props.message.sender.id === this.props.user.id) {
      return (
        <div className="Message senderLocal">
          <div className="messageTime">
            {timeString}
          </div>
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

export default Message;
