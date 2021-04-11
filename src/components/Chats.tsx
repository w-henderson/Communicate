import React from "react";
import ChatPreview from './ChatPreview';
import '../styles/Chats.scss';

interface ChatsProps {
  user: User | null,
  chats: Chat[],
  activeID: string | undefined
}

class Chats extends React.Component<ChatsProps> {
  render() {
    if (this.props.chats !== undefined && this.props.chats.length > 0) {
      return (
        <div className="Chats">
          {this.props.chats.map((value, index) =>
            <ChatPreview chat={value} user={this.props.user} key={index} active={this.props.activeID === value.id} />
          )}
        </div>
      );
    } else {
      return (
        <div className="Chats empty">
          You don't have any conversations!<br />
          Start one with the button above.
        </div>
      )
    }
  }
}

export default Chats;
