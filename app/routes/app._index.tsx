import { useState } from "react";
import { useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { ActionFunctionArgs, LoaderFunctionArgs, json } from "@remix-run/node";
import {
  Page,
  Layout,
  Text,
  Card,
  Box,
  Button,
  BlockStack,
  TextField,
  Form,
  FormLayout,
} from "@shopify/polaris";
import db from "../db.server";
import { authenticate } from "~/shopify.server";

interface Color {
  id: number;
  hexCode: string;
  createdAt: Date;
  updatedAt: Date;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return json(await db.colors.findMany());
};

export const action = async ({ request }: ActionFunctionArgs) => {
  await authenticate.admin(request);

  const formData = await request.formData(); 
  const action = formData.get("action"); 

  if (action === "delete") {
    const id = formData.get("id");

    if (id) {
      await db.colors.delete({ where: { id: Number(id) } });

      return json({ message: "Color deleted successfully" });
    } else {
      return json(
        { error: "ID is missing for delete action" },
        { status: 400 },
      );
    }
  } else {
    const color = formData.get("color");
    if (color) {
      await db.colors.create({ data: { hexCode: color.toString() } });

      return json({ message: "New color added!" });
    } else {
      return json({ error: "Color value is missing" }, { status: 400 });
    }
  }
};

export default function Index() {
  const actionData = useActionData<typeof action>();
  const colors = useLoaderData<Color[]>();

  const [color, setColor] = useState("");
  const [applyColor, setApplyColor] = useState("");

  const handleChange = (value: string) => {
    setColor(value);
  };

  const handleApplyColor = (e: any) => {
    setApplyColor(e);
  };
  const submit = useSubmit();

  const handleAddCustomColor = (e: any) => {
    e.preventDefault();
    submit(e.currentTarget, { method: "post" });
    setColor("");
  };

  return (
    <Page>
      <Layout>
        <Layout.AnnotatedSection
          title="Color Options"
          description="Choose a color from the sidebar to apply it to the central box."
        >
          <BlockStack gap="200">
            <Card>
                {colors.map((e) => (
                  <Box  padding="100" key={e.id}>
                        <Button onClick={() => handleApplyColor(e.hexCode)}>
                          {e.hexCode}
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() =>
                            submit({ id: e.id, action: "delete" }, { method: "post" })
                          }
                        >
                          Delete
                        </Button>
                  </Box>
                ))}
            </Card>
            <Card>
              <Form onSubmit={handleAddCustomColor}>
                <FormLayout>
                  <TextField
                    onChange={handleChange}
                    value={color}
                    type="text"
                    autoComplete="off"
                    label="Custom Color"
                    placeholder="Enter hex code"
                    name="color"
                  />
                  <Button submit>Add Custom Color</Button>
                </FormLayout>
              </Form>
            </Card>
          </BlockStack>
        </Layout.AnnotatedSection>

        <Layout.Section>
          <Card>
            <Text as="h3">Color Preview</Text>
            <div
              style={{
                width: "100%",
                height: "200px",
                backgroundColor: applyColor,
                marginTop: "16px",
              }}
            ></div>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
