import React from "react";
import "../styles/Icon.scss";

interface IconProps {
  spin?: boolean,
  onClick?: () => void,
}

class Icon extends React.Component<IconProps> {
  render() {
    return (
      <i
        className={`bi bi-${this.props.children}${this.props.spin ? " spin" : ""}`}
        onClick={this.props.onClick} />
    );
  }
}

export default Icon;
