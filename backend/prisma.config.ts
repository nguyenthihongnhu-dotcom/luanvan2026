import { defineConfig } from '@prisma/config'
import * as dotenv from 'dotenv'

// Nạp các biến môi trường từ file .env vào process.env
dotenv.config()

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
})