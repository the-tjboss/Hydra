import axios from "axios";
import { JSDOM } from "jsdom";

export interface Steam250Game {
  title: string;
  objectID: string;
}

export const requestSteam250 = async (path: string) => {
  return axios
    .get(`https://steam250.com${path}`)
