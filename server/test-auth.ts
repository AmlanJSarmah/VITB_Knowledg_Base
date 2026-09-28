import http from "http";
import app from "./src/index.js";
import prisma from "./src/lib/db.js";

const TEST_PORT = 3001;

function request(
  method: string,
  path: string,
  body?: any,
  token?: string
): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: "127.0.0.1",
        port: TEST_PORT,
        path,
        method,
        headers: {
          "Content-Type": "application/json",
          ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ status: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on("error", reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${message}`);
    process.exit(1);
  }
  console.log(`✅ ${message}`);
}

async function runTests() {
  console.log("--- Starting Authentication Integration Tests ---\n");

  const server = app.listen(TEST_PORT);

  const testUsername = `testuser_${Date.now()}`;
  const testPassword = "mypassword123";

  try {
    // 1. Register User
    const regRes = await request("POST", "/api/auth/register", {
      username: testUsername,
      password: testPassword,
      name: "Test Student",
    });

    assert(regRes.status === 201, `Registration returned 201 Created (got ${regRes.status})`);
    assert(Boolean(regRes.body.token), "Registration returned a JWT token");
    assert(regRes.body.user.username === testUsername, "User object has correct username");
    assert(regRes.body.user.password === undefined, "User password is not leaked in response");

    const token = regRes.body.token;

    // 2. Reject duplicate username
    const dupRes = await request("POST", "/api/auth/register", {
      username: testUsername,
      password: "anotherpassword",
    });
    assert(dupRes.status === 409, `Duplicate registration returned 409 Conflict (got ${dupRes.status})`);

    // 3. Validation failure
    const invalidRegRes = await request("POST", "/api/auth/register", {
      username: "ab",
      password: "123",
    });
    assert(invalidRegRes.status === 400, `Short username/password returned 400 Bad Request (got ${invalidRegRes.status})`);

    // 4. Successful Login
    const loginRes = await request("POST", "/api/auth/login", {
      username: testUsername,
      password: testPassword,
    });
    assert(loginRes.status === 200, `Login returned 200 OK (got ${loginRes.status})`);
    assert(Boolean(loginRes.body.token), "Login returned a JWT token");
    assert(loginRes.body.user.username === testUsername, "Login user object matches");

    const loginToken = loginRes.body.token;

    // 5. Invalid password
    const wrongPassRes = await request("POST", "/api/auth/login", {
      username: testUsername,
      password: "wrongpassword",
    });
    assert(wrongPassRes.status === 401, `Wrong password returned 401 Unauthorized (got ${wrongPassRes.status})`);

    // 6. Non-existent user
    const noUserRes = await request("POST", "/api/auth/login", {
      username: "nonexistentuser_9999",
      password: testPassword,
    });
    assert(noUserRes.status === 401, `Non-existent user returned 401 Unauthorized (got ${noUserRes.status})`);

    // 7. Protected route /api/auth/me
    const meRes = await request("GET", "/api/auth/me", null, loginToken);
    assert(meRes.status === 200, `GET /api/auth/me returned 200 OK (got ${meRes.status})`);
    assert(meRes.body.user.username === testUsername, "/me returned correct authenticated user");

    // 8. Protected route with no token
    const noAuthRes = await request("GET", "/api/auth/me");
    assert(noAuthRes.status === 401, `GET /api/auth/me without token returned 401 Unauthorized (got ${noAuthRes.status})`);

    // 9. Protected route with invalid token
    const badAuthRes = await request("GET", "/api/auth/me", null, "invalid.token.here");
    assert(badAuthRes.status === 401, `GET /api/auth/me with invalid token returned 401 Unauthorized (got ${badAuthRes.status})`);

    console.log("\n🎉 All authentication integration tests passed successfully!");
  } finally {
    // Cleanup created test user
    try {
      await prisma.user.deleteMany({
        where: { username: testUsername },
      });
      console.log("🧹 Test user cleanup completed.");
    } catch (e) {
      console.error("Cleanup error:", e);
    }
    server.close();
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("Test failed with error:", err);
  process.exit(1);
});
