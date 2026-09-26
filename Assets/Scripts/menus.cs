using System.Collections;
using System.Collections.Generic;
using UnityEditor;
using UnityEngine;
using UnityEngine.SceneManagement;

public class menus : MonoBehaviour
{
    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
    public void iniciar()
    {
        SceneManager.LoadScene("nivel1");
    }
    public void creditos()
    {
        SceneManager.LoadScene("creditos");
    }
    public void salir()
    {
        Application.Quit();
        //EditorApplication.isPlaying = false; //https://docs.unity3d.com/6000.0/Documentation/ScriptReference/EditorApplication-isPlaying.html
    }
    public void titulo()
    {
        SceneManager.LoadScene("titulo");
    }
}
