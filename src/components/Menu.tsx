import React from "react";
import Icon from './Icon';
import '../styles/Menu.scss';

interface MenuProps {
  user: User | null
}

class Menu extends React.Component<MenuProps> {
  render() {
    return (
      <div className="Menu">
        <img src={this.props.user?.profilePicture} alt="Profile" />
        <div>
          <Icon>chat-dots-fill</Icon>
          <Icon>gear-fill</Icon>
        </div>
      </div>
    );
  }
}

export default Menu;
