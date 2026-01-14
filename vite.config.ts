import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
<<<<<<< HEAD
    plugins: [
        react({
            babel: {
                plugins: [["babel-plugin-react-compiler"]],
            },
        }),
    ],
    server: {
        allowedHosts: [
            "test.1855789-cn23133.twc1.net",
            "fpin-projects.ru",
            "localhost",
            "127.0.0.1",
            "fpin-projects.ru:1268",
        ],
    },
});
=======
  plugins: [
    react({
      babel: {
        plugins: [["babel-plugin-react-compiler"]],
      },
    }),
  ],
  server: {
    allowedHosts: [
      "test.1855789-cn23133.twc1.net",
      "fpin-projects.ru",
      "localhost",
      "127.0.0.1",
      "fpin-projects.ru:1268",
    ],
  },
});

>>>>>>> f4f2c8820cab31cbbf6f704f7e3cf3519b1e31eb
