import React, { createContext, useState, useContext } from 'react';

const defaultAvatar = 'https://randomuser.me/api/portraits/men/1.jpg';
const defaultName = 'Your Name';

export const UserContext = createContext({
  avatar: defaultAvatar,
  setAvatar: (v: string) => {},
  name: defaultName,
  setName: (v: string) => {},
  userStoryPing: null as string | null,
  setUserStoryPing: (v: string | null) => {},
});

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [avatar, setAvatar] = useState(defaultAvatar);
  const [name, setName] = useState(defaultName);
  const [userStoryPing, setUserStoryPing] = useState<string | null>(null);
  return (
    <UserContext.Provider value={{ avatar, setAvatar, name, setName, userStoryPing, setUserStoryPing }}>
      {children}
    </UserContext.Provider>
  );
}; 