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
        <img src={this.props.user?.profilePicture} alt="Profile picture" />
        <div>
          <Icon>chat</Icon>
          <Icon>settings</Icon>
        </div>
      </div>
    );
  }
}

export default Menu;
