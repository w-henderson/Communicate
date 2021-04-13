import React from "react";
import ChatPreview from './ChatPreview';
import SearchBar from './SearchBar';
import '../styles/Chats.scss';

interface ChatsProps {
  user: User | null,
  chats: Chat[],
  activeID: string | undefined,
  selectCallback: (id: string) => void,
  searchBarActive: boolean
}

class Chats extends React.Component<ChatsProps> {
  render() {
    if (this.props.chats !== undefined && this.props.chats.length > 0) {
      return (
        <div className="Chats">
          <SearchBar hidden={!this.props.searchBarActive} />

          {this.props.chats.map((value, index) =>
            <ChatPreview
              chat={value}
              user={this.props.user}
              key={index}
              active={this.props.activeID === value.id} 
              selectCallback={() => this.props.selectCallback(value.id)}/>
          )}
        </div>
      );
    } else {
      return (
        <div className="Chats empty">
          <SearchBar hidden={!this.props.searchBarActive} />

          You don't have any conversations!<br />
          Start one with the button above.
        </div>
      )
    }
  }
}

export default Chats;
