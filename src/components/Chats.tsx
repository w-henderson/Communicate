import React from "react";
import ChatPreview from './ChatPreview';
import SearchBar from './SearchBar';
import Icon from './Icon';
import '../styles/Chats.scss';

interface ChatsProps {
  chats: Chat[] | undefined,
  activeID: string | undefined,
  selectCallback: (id: string) => void,
  searchBarActive: boolean,
  createConversation: (user: User) => void
}

class Chats extends React.Component<ChatsProps> {
  render() {
    if (this.props.chats !== undefined && this.props.chats.length > 0) {
      return (
        <div className="Chats">
          <SearchBar
            hidden={!this.props.searchBarActive} 
            createConversation={this.props.createConversation} />

          {this.props.chats.map((value, index) =>
            <ChatPreview
              chat={value}
              key={index}
              active={this.props.activeID === value.id} 
              selectCallback={() => this.props.selectCallback(value.id)}/>
          )}
        </div>
      );
    } else if (this.props.chats !== undefined) {
      return (
        <div className="Chats empty">
          <SearchBar
            hidden={!this.props.searchBarActive} 
            createConversation={this.props.createConversation} />

          You don't have any conversations!<br />
          Start one with the button above.
        </div>
      )
    } else {
      return (
        <div className="Chats empty">
          <SearchBar
            hidden={!this.props.searchBarActive} 
            createConversation={this.props.createConversation} />

          <Icon spin={true}>arrow-repeat</Icon>
        </div>
      )
    }
  }
}

export default Chats;
