using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class GunScriptEnemy : MonoBehaviour
{
    public GameObject proj_base;
    GameObject proj;
    bool parentFlip;
    Animator anim;
    // Start is called before the first frame update
    void Start()
    {
        anim = GetComponent<Animator>();
    }

    // Update is called once per frame
    void Update()
    {
        parentFlip = gameObject.transform.parent.GetComponent<SpriteRenderer>().flipX;
        if (parentFlip)
        {
            transform.localPosition = new Vector3(-0.6f, 0, 0);
        }
        else
        {
            transform.localPosition = new Vector3(0.6f, 0, 0);

        }
        GetComponent<SpriteRenderer>().flipX = parentFlip;
    }
    private void FixedUpdate()
    {
        if (GameObject.FindGameObjectWithTag("Player") && Mathf.Abs(GameObject.FindGameObjectWithTag("Player").transform.position.x - transform.position.x) < 14f)
        {
            if (UnityEngine.Random.Range(0, 32) == 0 && Time.timeScale != 0)
            {
                anim.SetTrigger("fire");
                proj = Instantiate(proj_base, transform.position, Quaternion.identity);
                proj.GetComponent<Rigidbody2D>().AddForce(new Vector2(parentFlip ? -1000 : 1000, 0), ForceMode2D.Force);
            }
        }
    }
}
