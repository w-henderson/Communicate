import React from "react";
import Icon from './Icon';
import '../styles/Menu.scss';

import FirebaseContext from "../firebase/FirebaseContext";

interface MenuProps {
  searchCallback: () => void
}

class Menu extends React.Component<MenuProps> {
  render() {
    return (
      <div className="Menu">
        <img src={this.context.user?.profilePicture} alt="Profile" />
        <div>
          <Icon onClick={this.props.searchCallback}>chat-dots-fill</Icon>
          <Icon>gear-fill</Icon>
        </div>
      </div>
    );
  }
}

Menu.contextType = FirebaseContext;

export default Menu;
