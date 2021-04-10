import React from "react";
import '../styles/ConversationHeader.scss';

import Icon from './Icon';

interface ConversationHeaderProps {
  recipientUser: User | undefined
}

class ConversationHeader extends React.Component<ConversationHeaderProps> {
  render() {
    if (this.props.recipientUser !== undefined) {
      return (
        <div className="ConversationHeader">
          <img src={this.props.recipientUser.profilePicture} alt="Recipient profile" />
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
