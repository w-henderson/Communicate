import React from "react";

interface IconProps {
  onClick?: () => void
}

class Icon extends React.Component<IconProps> {
  render() {
    return (
      <i className={`bi bi-${this.props.children}`} onClick={this.props.onClick}></i>
    );
  }
}

export default Icon;
