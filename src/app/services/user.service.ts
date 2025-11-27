import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private baseUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) { }

  getUserProfile(userId: number): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/user/${userId}`);
  }

  updateUserProfile(userId: number, data: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/user/${userId}`, data);
  }
}

