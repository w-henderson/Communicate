interface User {
  name: string,
  id: string,
  profilePicture: string
}

interface Message {
  content: string,
  sender: User,
  timestamp: number,
  readUsers: User[]
}

interface Chat {
  recipient: User,
  id: string,
  mostRecentMessage: Message
}

interface FullChat {
  recipient: User,
  id: string,
  messages: Message[]
}