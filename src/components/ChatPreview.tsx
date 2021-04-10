import React from "react";
import humanize from '../DateHumanizer';

interface ChatPreviewProps {
  chat: Chat
}

class ChatPreview extends React.Component<ChatPreviewProps> {
  render() {
    return (
      <div className="ChatPreview">
        <img src={this.props.chat.recipient.profilePicture} alt="Recipient profile picture" />
        <span className="recipientName">{this.props.chat.recipient.name}</span>
        <span className="latestMessage">{this.props.chat.mostRecentMessage.content}</span>
        <span className="messageDate">{humanize(new Date(this.props.chat.mostRecentMessage.timestamp))}</span>
      </div>
    );
  }
}

export default ChatPreview;
