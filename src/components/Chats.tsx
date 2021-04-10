import React from "react";
import ChatPreview from './ChatPreview';
import '../styles/Chats.scss';

interface ChatsProps {
  chats: Chat[],
}

class Chats extends React.Component<ChatsProps> {
  render() {
    return (
      <div className="Chats">
        {this.props.chats.map((value, index) =>
          <ChatPreview chat={value} key={index} />
        )}
      </div>
    );
  }
}

export default Chats;
