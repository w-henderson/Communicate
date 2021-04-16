import React from "react";
import FirebaseContext from "../firebase/FirebaseContext";
import humanize from '../DateHumanizer';

interface ChatPreviewProps {
  chat: Chat,
  active: boolean,
  selectCallback: () => void
}

class ChatPreview extends React.Component<ChatPreviewProps> {
  render() {
    let unread = this.context.user !== null
      && !this.props.chat.mostRecentMessage?.readUsers.map(val => val.id).includes(this.context.user.id)
      && this.props.chat.mostRecentMessage !== null;
    let content = this.props.chat.mostRecentMessage?.content || (<i>No messages in this conversation</i>);
    let date = humanize(new Date(this.props.chat.mostRecentMessage?.timestamp || 0));
    if (date === "01/01/70") date = ""; // if timestamp is 0 or null or undefined, just hide it

    return (
      <div className={this.props.active ? "ChatPreview active" : "ChatPreview"} onClick={() => this.props.selectCallback()}>
        <img src={this.props.chat.recipient.profilePicture} alt="Recipient profile" />
        <span className={unread ? "recipientName unread" : "recipientName"}>{this.props.chat.recipient.name}</span>
        <span className="latestMessage">{content}</span>
        <span className="messageDate">{date}</span>

        {unread &&
          <span className="unreadBubble"></span>
        }
      </div>
    );
  }
}

ChatPreview.contextType = FirebaseContext;

export default ChatPreview;
