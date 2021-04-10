import React from "react";
import humanize from '../DateHumanizer';

interface ChatPreviewProps {
  chat: Chat,
  user: User | null
}

class ChatPreview extends React.Component<ChatPreviewProps> {
  render() {
    return (
      <div className="ChatPreview">
        <img src={this.props.chat.recipient.profilePicture} alt="Recipient profile picture" />
        <span className="recipientName">{this.props.chat.recipient.name}</span>
        <span className="latestMessage">{this.props.chat.mostRecentMessage.content}</span>
        <span className="messageDate">{humanize(new Date(this.props.chat.mostRecentMessage.timestamp))}</span>

        {(this.props.user !== null && !this.props.chat.mostRecentMessage.readUsers.includes(this.props.user)) &&
          <span className="unreadBubble"></span>
        }
      </div>
    );
  }
}

export default ChatPreview;
