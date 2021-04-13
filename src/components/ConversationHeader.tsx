import React from "react";
import '../styles/ConversationHeader.scss';

import Icon from './Icon';

interface ConversationHeaderProps {
  recipientUser: User | undefined,
  showBackButton: boolean,
  back: () => void
}

class ConversationHeader extends React.Component<ConversationHeaderProps> {
  render() {
    if (this.props.recipientUser !== undefined) {
      return (
        <div className="ConversationHeader">
          {this.props.showBackButton &&
            <Icon onClick={this.props.back}>caret-left-fill</Icon>
          }
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
