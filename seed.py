import os
import uuid
import math
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Get an existing profile to use as professor_id
prof_resp = supabase.table("profiles").select("id").limit(1).execute()
prof_id = prof_resp.data[0]["id"] if prof_resp.data else None

# 2. Create Lab Section
lab_data = {
    "title": "Basic Machine Learning Concepts",
    "description": "A series of basic Machine Learning mathematical functions and metrics."
}
if prof_id:
    lab_data["professor_id"] = prof_id

lab_resp = supabase.table("lab_sections").insert(lab_data).execute()

lab_id = lab_resp.data[0]['id']

questions_data = [
    {
        "title": "1. Mean Squared Error (MSE)",
        "desc": "Given a single string of alternating true and predicted values `y_true1 y_pred1 y_true2 y_pred2 ...` separated by spaces, calculate the Mean Squared Error (MSE). Print the result rounded to 2 decimal places.\n\n**Example Input:**\n`3 2.5 5 5 2 3`\n(This means true=[3, 5, 2] and pred=[2.5, 5, 3])\n\n**Example Output:**\n`0.42`",
        "tcs": [
            {"in": "3 2.5 5 5 2 3\n", "out": "0.42\n"},
            {"in": "0 0 1 1 0 1\n", "out": "0.33\n"}
        ]
    },
    {
        "title": "2. Accuracy Score",
        "desc": "Given a string of alternating true labels and predicted labels (0s and 1s) separated by spaces, calculate the classification accuracy as a percentage (rounded to 2 decimal places, no % sign).\n\n**Example Input:**\n`1 1 0 0 1 0 1 1`\n(true=[1,0,1,1], pred=[1,0,0,1])\n\n**Example Output:**\n`75.00`",
        "tcs": [
            {"in": "1 1 0 0 1 0 1 1\n", "out": "75.00\n"},
            {"in": "1 0 1 0 0 0\n", "out": "0.00\n"}
        ]
    },
    {
        "title": "3. ReLU Activation",
        "desc": "Given a space-separated list of numbers (floats), apply the Rectified Linear Unit (ReLU) function to each element. Print the resulting elements separated by spaces, rounded to 1 decimal place.\n\n**Example Input:**\n`-2.5 0.0 3.1 -0.1`\n\n**Example Output:**\n`0.0 0.0 3.1 0.0`",
        "tcs": [
            {"in": "-2.5 0.0 3.1 -0.1\n", "out": "0.0 0.0 3.1 0.0\n"},
            {"in": "10 -5 2\n", "out": "10.0 0.0 2.0\n"}
        ]
    },
    {
        "title": "4. Linear Regression Prediction",
        "desc": "Given an input containing `m` (slope), `c` (intercept), followed by a list of `x` values (all space separated), calculate the predicted `y` values `y = mx + c`. Print the results separated by spaces, rounded to 1 decimal place.\n\n**Example Input:**\n`2.0 1.0 0 1 2 3`\n\n**Example Output:**\n`1.0 3.0 5.0 7.0`",
        "tcs": [
            {"in": "2.0 1.0 0 1 2 3\n", "out": "1.0 3.0 5.0 7.0\n"},
            {"in": "-1.5 10 0 5 10\n", "out": "10.0 2.5 -5.0\n"}
        ]
    },
    {
        "title": "5. Manhattan Distance",
        "desc": "Given four space-separated numbers `x1 y1 x2 y2` representing two 2D points, calculate the Manhattan distance between them. Print the result rounded to 1 decimal place.\n\n**Example Input:**\n`1 2 4 6`\n\n**Example Output:**\n`7.0`",
        "tcs": [
            {"in": "1 2 4 6\n", "out": "7.0\n"},
            {"in": "0 0 -3 -4\n", "out": "7.0\n"}
        ]
    },
    {
        "title": "6. Euclidean Distance",
        "desc": "Given four space-separated numbers `x1 y1 x2 y2` representing two 2D points, calculate the Euclidean distance between them. Print the result rounded to 2 decimal places.\n\n**Example Input:**\n`0 0 3 4`\n\n**Example Output:**\n`5.00`",
        "tcs": [
            {"in": "0 0 3 4\n", "out": "5.00\n"},
            {"in": "1 1 2 2\n", "out": "1.41\n"}
        ]
    },
    {
        "title": "7. Sigmoid Function",
        "desc": "Given a space-separated list of numbers (floats), apply the Sigmoid function `1 / (1 + exp(-x))` to each. Print the resulting elements separated by spaces, rounded to 4 decimal places.\n\n**Example Input:**\n`0 2 -2`\n\n**Example Output:**\n`0.5000 0.8808 0.1192`",
        "tcs": [
            {"in": "0 2 -2\n", "out": "0.5000 0.8808 0.1192\n"},
            {"in": "10 -10\n", "out": "1.0000 0.0000\n"}
        ]
    },
    {
        "title": "8. Precision Score",
        "desc": "Given four integers separated by spaces: `True_Positives False_Positives True_Negatives False_Negatives`, calculate the Precision. Print it as a percentage rounded to 1 decimal place. If the denominator is 0, print `0.0`.\n\n**Example Input:**\n`8 2 90 10`\n\n**Example Output:**\n`80.0`",
        "tcs": [
            {"in": "8 2 90 10\n", "out": "80.0\n"},
            {"in": "0 5 10 10\n", "out": "0.0\n"}
        ]
    },
    {
        "title": "9. Recall Score",
        "desc": "Given four integers separated by spaces: `True_Positives False_Positives True_Negatives False_Negatives`, calculate the Recall. Print it as a percentage rounded to 1 decimal place. If the denominator is 0, print `0.0`.\n\n**Example Input:**\n`8 2 90 10`\n\n**Example Output:**\n`44.4`",
        "tcs": [
            {"in": "8 2 90 10\n", "out": "44.4\n"},
            {"in": "5 0 0 0\n", "out": "100.0\n"}
        ]
    },
    {
        "title": "10. F1 Score",
        "desc": "Given Precision (P) and Recall (R) as two space-separated percentages (e.g., `80.0 44.4`), calculate the F1 Score: `2 * (P * R) / (P + R)`. Print it rounded to 1 decimal place. If denominator is 0, print `0.0`.\n\n**Example Input:**\n`80.0 44.4`\n\n**Example Output:**\n`57.1`",
        "tcs": [
            {"in": "80.0 44.4\n", "out": "57.1\n"},
            {"in": "100.0 100.0\n", "out": "100.0\n"}
        ]
    }
]

for q in questions_data:
    q_resp = supabase.table("questions").insert({
        "lab_id": lab_id,
        "title": q["title"],
        "description": q["desc"],
        "difficulty": "Easy",
        "points": 10
    }).execute()
    
    q_id = q_resp.data[0]['id']
    
    for i, tc in enumerate(q["tcs"]):
        in_path = f"{lab_id}/{q_id}/tc_{i}_in.txt"
        out_path = f"{lab_id}/{q_id}/tc_{i}_out.txt"
        
        # Upload to storage
        supabase.storage.from_("lab-files").upload(in_path, tc["in"].encode('utf-8'), {"content-type": "text/plain"})
        supabase.storage.from_("lab-files").upload(out_path, tc["out"].encode('utf-8'), {"content-type": "text/plain"})
        
        # Insert to DB
        supabase.table("test_cases").insert({
            "question_id": q_id,
            "input_file_path": in_path,
            "output_file_path": out_path,
            "is_hidden": i > 0 # First testcase is visible, others hidden
        }).execute()
        
print("Successfully seeded 10 ML questions!")
