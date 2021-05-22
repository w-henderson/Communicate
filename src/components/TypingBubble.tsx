import React from "react";

class TypingBubble extends React.Component {
  render() {
    return (
      <div className="Message senderRemote">
        <div className="messageContent">
          <div className="typingDot" style={{ animationDelay: "0s" }} />
          <div className="typingDot" style={{ animationDelay: "0.2s" }} />
          <div className="typingDot" style={{ animationDelay: "0.4s" }} />
        </div>
      </div>
    )
  }
}

export default TypingBubble;
