// lib/userContext.js
import { createContext } from 'react'

const UserContext = createContext({
  user: null,
  setUser: () => {},
})

export default UserContext
