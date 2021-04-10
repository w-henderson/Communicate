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
    return (
      <div className="Chats">
        {this.props.chats.map((value, index) =>
          <ChatPreview chat={value} user={this.props.user} key={index} active={this.props.activeID === value.id} />
        )}
      </div>
    );
  }
}

export default Chats;
