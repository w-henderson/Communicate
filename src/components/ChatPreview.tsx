import React from "react";
import humanize from '../DateHumanizer';

interface ChatPreviewProps {
  chat: Chat,
  user: User | null,
  active: boolean,
  selectCallback: () => void
}

class ChatPreview extends React.Component<ChatPreviewProps> {
  render() {
    let unread = this.props.user !== null && !this.props.chat.mostRecentMessage.readUsers.includes(this.props.user);

    return (
      <div className={this.props.active ? "ChatPreview active" : "ChatPreview"} onClick={() => this.props.selectCallback()}>
        <img src={this.props.chat.recipient.profilePicture} alt="Recipient profile" />
        <span className={unread ? "recipientName unread" : "recipientName"}>{this.props.chat.recipient.name}</span>
        <span className="latestMessage">{this.props.chat.mostRecentMessage.content}</span>
        <span className="messageDate">{humanize(new Date(this.props.chat.mostRecentMessage.timestamp))}</span>

        {unread &&
          <span className="unreadBubble"></span>
        }
      </div>
    );
  }
}

export default ChatPreview;
