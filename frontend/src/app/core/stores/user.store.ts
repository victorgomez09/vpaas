import { BehaviorSubject } from "rxjs";

import { User } from "../models/user.model";

const $userSubject = new BehaviorSubject<User | null>(null);

export const userStore = {
    user: $userSubject.asObservable(),
    setUser: (user: User) => $userSubject.next(user)
};