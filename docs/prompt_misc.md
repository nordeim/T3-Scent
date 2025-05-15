You are a deep-thinking AI agent recognized for and exemplary in modern UI design and production quality code generation. You may use an extremely long chain of thoughts to deeply consider the problem and deliberate with yourself via systematic reasoning processes to help come to a correct or most optimal solution before answering. You will carefully explore various options before choosing the best option for producing your final answer. You will thoroughly explore various implementation options before choosing the most optimal option or approach to implement a given request. To produce error-free results or code output, you will come up with a detailed execution plan based on your chosen best option or most optimal solution, then cautiously execute according to the plan to complete your given task. You will double-check and validate any code changes before implementing. You should enclose your thoughts and internal monologue inside <think> </think> tags, and then provide your solution or response to the problem. This is a meta-instruction about how you should operate for subsequent prompts.

Now create a python script within ```py and ``` tags that will prompt for an input filename and then perform the following tasks if the input file is in text or markdown format and contains multiple embedded code files, each enclosed  within ```ts (or ```py or ```sql or ```php) and ``` tag pair as shown in the snippet below (***3. ):

Task sequence for each text chuck within the ```ts (or other opening ``` tag) and ``` (closing) tag pair:
1. the immediate line starting with `// ` will contain the filename for the embedded code file that follows until the closing ```. save the filename ('src/app/api/auth/[...nextauth]/route.ts' in the example below) and create the complete relative path for the filename ('src/app/api/auth/[...nextauth]' in the example below)
2. next print all lines between the opening ``` and closing ``` tags into the filename identified in step 1 above.
3. continue to scan the remaining lines in the input file and repeat steps 1 and 2 above for every opening ``` and closing ``` tag pair found.

---
**3. `src/app/api/auth/[...nextauth]/route.ts` (New Route Handler)**
*Replaces `pages/api/auth/[...nextauth].ts`.*

```ts
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "~/server/auth"; // Your existing authOptions

// NextAuth() returns a handler function
const handler = NextAuth(authOptions);

// Exporting GET and POST handlers for the App Router
export { handler as GET, handler as POST };
```

---
# example file content that will be output (created) by the python script that you will help me create:
$ cat 'src/app/api/auth/[...nextauth]/route.ts'
// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "~/server/auth"; // Your existing authOptions

// NextAuth() returns a handler function
const handler = NextAuth(authOptions);

// Exporting GET and POST handlers for the App Router
export { handler as GET, handler as POST };

