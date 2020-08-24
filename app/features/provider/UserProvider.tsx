import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { auth } from '../../firebase';

type Props = {
  children: ReactNode,
};

export const UserContext = createContext({ user: null });

export default function UserProvider({ children }: Props) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    auth.onAuthStateChanged(async (userAuth) => {
      // TODO: get user doc
      console.log("changed!");
      console.log(userAuth);
      setUser(userAuth);
    });
  });

  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}
