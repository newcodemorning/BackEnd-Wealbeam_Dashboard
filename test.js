/*


OLD

    POST: localhost:3000/faqs/add-new 
    {
        "question": "What is your return policy?",
        "answer": "You can return items within 30 days."
    }



NEW

    POST: localhost:3000/faqs/add-new
    {
        "question":{
            "ar":"ما هي سياسة الإرجاع الخاصة بك؟",
            "en":"What is your return policy?",
        },
        "answer":{
            "ar":"يمكنك إرجاع العناصر خلال 30 يومًا.",
            "en":"You can return items within 30 days."
        }
    }



GET: localhost:3000/en/faqs/get
GET: localhost:3000/ar/faqs/get
{
    "question": "What is your return policy?",
    "answer": "You can return items within 30 days."
}





GET: localhost:3000/faqs/get/
{
    "question": {
        "ar": "ما هي سياسة الإرجاع الخاصة بك؟",
        "en": "What is your return policy?"
    },
    "answer": {
        "ar": "يمكنك إرجاع العناصر خلال 30 يومًا.",
        "en": "You can return items within 30 days."
    }
}























*/