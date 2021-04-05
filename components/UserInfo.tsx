import { useEffect } from 'react'
import FloatingElement from './FloatingElement'

const UserInfo = () => {
  useEffect(() => {
    console.log('user info')
  })

  return (
    <FloatingElement>
      <div>
        User Info
        <div>Tabs Here</div>
        <div>More Stuff</div>
      </div>
    </FloatingElement>
  )
}

export default UserInfo
