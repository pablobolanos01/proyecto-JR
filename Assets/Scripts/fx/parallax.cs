using UnityEngine;

public class parallax : MonoBehaviour //extiende de MonoBehaviour, creando un componente
{
    Camera cam;
    Vector3 cam_pos0;
    public float parallaxF = .5f;
    // Start is called before the first frame update
    void Start()
    {
        cam = Camera.main;
        cam_pos0 = cam.transform.position;
    }

    // Update is called once per frame
    void Update()
    {
        Vector3 cam_offset = cam.transform.position - cam_pos0;
        transform.position += cam_offset * parallaxF;
        cam_pos0 = cam.transform.position;
    }
}
