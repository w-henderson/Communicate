interface User {
  name: string,
  id: string,
  profilePicture: string
}

interface UserMessage {
  content: string,
  sender: User,
  timestamp: number,
  readUsers: User[]
}

interface Chat {
  recipient: User,
  id: string,
  mostRecentMessage: UserMessage
}

interface FullChat {
  recipient: User,
  id: string,
  messages: UserMessage[]
}