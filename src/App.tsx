// import { useEffect, useState } from "react";
import { ChakraProvider, Divider, Flex, Heading, VStack } from "@chakra-ui/react";
import { CodeEditor } from "./components/editor/CodeEditor";
import { registerLanguages } from "./components/editor/monarch/loader";
registerLanguages();

export default function App() {
  // const [text, setText] = useState('print("Hello world!")');
  return (
    <ChakraProvider>
      <Flex h="100vh" w="100vw" p={10}>
        <VStack w="100%" boxShadow={"md"} p={4} borderStyle={"solid"} borderWidth={1} rounded={"lg"}>
          <Heading>Code Editor</Heading>
          <Divider />
          <CodeEditor></CodeEditor>
        </VStack>
      </Flex>
    </ChakraProvider>
  );
}
