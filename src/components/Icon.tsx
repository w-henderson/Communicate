import React from "react";
import "../styles/Icon.scss";

interface IconProps {
  spin?: boolean,
  color?: string,
  onClick?: () => void,
}

class Icon extends React.Component<IconProps> {
  render() {
    let style: React.CSSProperties | undefined = this.props.color ? {
      color: this.props.color,
      opacity: 1
    } : undefined;

    return (
      <i
        className={`bi bi-${this.props.children}${this.props.spin ? " spin" : ""}`}
        onClick={this.props.onClick}
        style={style} />
    );
  }
}

export default Icon;
