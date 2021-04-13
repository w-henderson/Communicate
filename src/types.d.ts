interface User {
  name: string,
  id: string,
  profilePicture: string,
  emailAddress: string
}

interface UserMessage {
  id: string,
  content: string,
  sender: User,
  timestamp: number,
  readUsers: User[]
}

interface Chat {
  recipient: User,
  id: string,
  mostRecentMessage: UserMessage | null
}

interface FullChat {
  recipient: User,
  id: string,
  messages: UserMessage[]
}