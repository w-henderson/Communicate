import React from "react";
import '../styles/ConversationHeader.scss';

import Icon from './Icon';

interface ConversationHeaderProps {
  recipientUser: User | null
}

class ConversationHeader extends React.Component<ConversationHeaderProps> {
  render() {
    if (this.props.recipientUser !== null) {
      return (
        <div className="ConversationHeader">
          <img src={this.props.recipientUser.profilePicture} alt="Recipient profile picture" />
          <span>{this.props.recipientUser.name}</span>
          <Icon>three-dots-vertical</Icon>
        </div>
      );
    } else {
      return (
        <div className="ConversationHeader"></div>
      );
    }
  }
}

export default ConversationHeader;
