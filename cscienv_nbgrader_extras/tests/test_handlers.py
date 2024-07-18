import json


async def test_get_example(jp_fetch):
    # When
    response = await jp_fetch("cscienv-nbgrader-extras", "get_example")

    # Then
    assert response.code == 200
    payload = json.loads(response.body)
    assert payload == {
        "data": "This is /cscienv-nbgrader-extras/get_example endpoint!"
    }