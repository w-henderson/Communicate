interface User {
  name: string,
  id: string,
  profilePicture: string
}

interface Message {
  content: string,
  sender: User,
  timestamp: number
}

interface Chat {
  recipient: User,
  mostRecentMessage: Message
}